import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CertificatesService } from './certificates.service';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('issue')
  issueCertificate(
    @Body() dto: IssueCertificateDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.certificatesService.issueCertificate(dto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  listMyCertificates(@CurrentUser() user: { sub: string }) {
    return this.certificatesService.listMyCertificates(user.sub);
  }

  @Get('verify/:serial')
  verify(@Param('serial') serial: string) {
    return this.certificatesService.verifyBySerial(serial);
  }
}
